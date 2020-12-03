<%- include('header') -%>

<!-- inner banner -->

<!-- //inner banner -->
<!-- breadcrumbs -->

<!-- //breadcrumbs -->
<!-- title description-->
<%- include partials/accountActions.ejs %>

<%- include partials/smsMfaModal.ejs %>
<%- include partials/openAccount.ejs %>
<div class="services-bot-agile2 py-sm-5 py-3">
  
  <!-- Start User Prompt -->
  <!-- Use locals.user here to avoid an error if "user" isn't defined. -->
  <% if(locals.userPrompt){ %>
  <div class="alert alert-warning alert-dismissible fade show" role="alert" id="userPrompt">
    <%= locals.userPrompt.description %>
    <form class="col-sm-2 d-inline-block">
      <select class="form-control" id="<%= locals.userPrompt.key %>">
        <% for(var i=0; i < locals.userPrompt.options.length; i++) { %>
        <option value="<%= locals.userPrompt.options[i].const %>">
          <%= locals.userPrompt.options[i].title %>
        </option>
        <% } %>
      </select>
    </form>
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
  <% } %>
  <!-- End User Prompt -->
  
  <button type="button" class="btn btn-danger btn-lg float-right av-button" onclick="openAccount()">Open Account</button>
  <% if(locals.user.userinfo.admin){ %>
       <button type="button" class="btn btn-danger btn-lg float-right av-button" onclick="openAccount()">Admin</button>
  <% } %>
  <button type="button" class="btn btn-danger btn-lg float-right av-button" data-toggle="modal" data-target="#tokenModal">View Tokens</button>

  <div class="row py-lg-5">

    <div class="col-lg-2  bb-left">
      <div class="card w-100">
        <img class="card-img-top" src="<%= assetsUrl %>userImage.jpg" alt="Card image cap">
      </div>

    </div>
    <div class="col-lg-7">
      <h2 class="agile-title"><%= user.name %></h2>
      <h6><%= user.preferred_username %></h6>
      <br>
      <h4>Open Accounts: <span id="accountNum">0</span></h4>
      <h4>Closed Accounts: <span id="closedAccountNum">0</span></h4>
      <h4>Transactions <span id="transactionNum">0</span></h4>
    </div>
  </div>
</div>

<!-- Start Token Viewer -->
        <div class="modal" id="tokenModal" tabindex="-1" role="dialog" aria-hidden="false">
          <div class="modal-dialog modal-jf" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">OAuth Tokens</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body">
                <div class="card-deck">
                  <div class="card" v-for="card in cards">
                    <p v-bind:class="['card-header', card.name]">[[ card.name ]]</p>
                    <div class="card-body">
                      <b>JWT</b>
                      <textarea class="form-control" readonly="" rows="12" cols="100%" style="font-size:10px">[[ card.jwt ]]</textarea>
                      <b>Header</b>
                      <textarea class="form-control" readonly="" rows="5" cols="100%" style="font-size:11px">[[ header(card.jwt) ]]</textarea>
                      <b>Payload</b>
                      <textarea class="form-control" readonly="" rows="30" cols="100%" style="font-size:11px">[[ payload(card.jwt) ]]</textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
<!-- End Token Viewer -->


<div class="modal fade general-modal" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg general-modal" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLabel">Your Security Preferences</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body general-modal">
        <center>
          <h3>Your Enrolled Factors</h3>
          <br>
          <div id="factorsApp" class="btn-group-vertical">
            <factor-item v-for="factor in factors" :factor="factor" :key="factor._id"/>
          </div>
          <br>
          <br>
          <button class='btn btn-danger' onclick="resetMfa()">reset MFA</button>
          <button class='btn btn-danger' onclick="reEnroll()">renroll</button>
        </center>
      </div>
    </div>
  </div>
</div>
<!-- //andrew description -->

<div class="modal fade general-modal" id="exampleModal1" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLabel1">Sign In to Renenroll</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body general-modal">
        <div id="okta"></div>
      </div>
    </div>
  </div>
</div>
<!-- //andrew description -->
<!-- //title description -->
<!-- Accounts -->
<section class="wfour-row py-sm-5 pt-3 slide-bg position-relative transactions" id="we_offer_agile">
  <div class="container py-md-5 py-3">
    <div class="services-bot-agile position-absolute">
      <br>
      <h3 class="agile-title text-center" style="color: White;">Accounts</h3>
      <div id="app" class="row mt-5">
        <account-item v-for="account in accounts" :account="account" :key="account._id"/>
      </div>
    </div>
  </div>
</section>
<!-- Transactions -->
<section>
  <center><h3>Transactions</h3></center>
  <table class="table table-dark table-striped">
    <thead>
      <tr>
        <th scope="col">#</th>
        <th scope="col">First</th>
        <th scope="col">Last</th>
        <th scope="col">Handle</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">1</th>
        <td>Mark</td>
        <td>Otto</td>
        <td>@mdo</td>
      </tr>
      <tr>
        <th scope="row">2</th>
        <td>Jacob</td>
        <td>Thornton</td>
        <td>@fat</td>
      </tr>
      <tr>
        <th scope="row">3</th>
        <td>Larry</td>
        <td>the Bird</td>
        <td>@twitter</td>
      </tr>
    </tbody>
  </table>
</section>

<!-- /Services section -->
<%- include('footer') -%>